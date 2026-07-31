{ inputs, ... }:
{
  perSystem =
    {
      config,
      lib,
      pkgs,
      self',
      ...
    }:
    let
      node = pkgs.nodejs_24;
      pnpm = pkgs.pnpm.override {
        nodejs = node;
      };
      preCommitCheck = inputs.git-hooks.lib.${pkgs.stdenv.hostPlatform.system}.run {
        src = ./.;
        hooks.format = {
          enable = true;
          name = "biome format and lint";
          entry = "${lib.getExe pnpm} exec turbo format:fix lint:fix";
          pass_filenames = false;
        };
      };
    in
    {
      process-compose.services = {
        imports = [
          inputs.services-flake.processComposeModules.default
        ];

        services.mongodb.mongodb = {
          enable = true;
          package = pkgs.mongodb-ce;
        };
        services.redis.redis.enable = true;

        settings.processes = {
          web = {
            command = "${lib.getExe pnpm} dev --filter web";
            namespace = "web";
          };
          storybook = {
            command = "${lib.getExe pnpm} run storybook";
            namespace = "storybook";
          };
        };
      };

      checks.pre-commit = preCommitCheck;

      packages = {
        default = config.process-compose.services.outputs.package;
        services-up = config.process-compose.services.outputs.package;
      };

      devShells.default = pkgs.mkShell {
        packages = [
          pnpm
          node
          config.process-compose.services.outputs.package
        ]
        ++ preCommitCheck.enabledPackages;

        shellHook = preCommitCheck.shellHook;
      };
    };
}
